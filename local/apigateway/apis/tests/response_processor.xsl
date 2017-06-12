<xsl:stylesheet version="1.0" 
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:dp="http://www.datapower.com/extensions" 
	extension-element-prefixes="dp" exclude-result-prefixes="dp">


  <!-- the dir _common is pre-populated -->
  <xsl:template match="/">
    <processor-transformed-output>
      <xsl:copy-of select="."/>
      <newField>added by response processor</newField>
    </processor-transformed-output>
  </xsl:template>

</xsl:stylesheet>